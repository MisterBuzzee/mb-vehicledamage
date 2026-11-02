import { AdminWorld, every, progress } from "@aicore-fivem/lib/client";
import { sleep } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import { readSettings, type VehicleDamageSettings } from "common/vehicleDamage";

// ---------- Settings ----------

const world = new AdminWorld(["settings"]);
const content = { settings: world.view("settings", readSettings) };

const DEFAULTS: VehicleDamageSettings = {
  globalSeverity: 1.1, minorDeltaV: 3.5, moderateDeltaV: 7, severeDeltaV: 12,
  powerLossMinor: 0.12, powerLossModerate: 0.3, powerLossSevere: 0.6,
  engineHitMinor: 60, engineHitModerate: 200, engineHitSevere: 450,
  bodyHitMinor: 80, bodyHitModerate: 220, bodyHitSevere: 450,
  smokeAtEngineHP: 450, fireAtEngineHP: 220,
  screenShakeMinor: 0.25, screenShakeModerate: 0.55, screenShakeSevere: 0.95,
  tireItem: "tire", tireRepairAll: true,
};

function settings(): VehicleDamageSettings {
  return content.settings?.value ?? DEFAULTS;
}

// ---------- State ----------

interface VehState {
  lastSpeed: number;
  lastEngHp: number;
  lastBodyHp: number;
  lastVel: [number, number, number];
}

const vehState = new Map<number, VehState>();
let torqueMul = 1.0;

function getVehState(v: number): VehState {
  let st = vehState.get(v);
  if (!st) {
    st = { lastSpeed: 0, lastEngHp: 1000, lastBodyHp: 1000, lastVel: [0, 0, 0] };
    vehState.set(v, st);
  }
  return st;
}

// ---------- Helpers ----------

function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

function prob(p: number): boolean {
  return Math.random() < p;
}

function impactAngleMultiplier(v: number, relVel: { x: number; y: number; z: number }): number {
  const fw = GetEntityForwardVector(v) as [number, number, number];
  const [fx, fy, fz] = fw;
  const right = { x: fy, y: -fx, z: fz };
  const fDot = fx * relVel.x + fy * relVel.y + fz * relVel.z;
  const rDotAbs = Math.abs(right.x * relVel.x + right.y * relVel.y + right.z * relVel.z);
  if (Math.abs(fDot) >= rDotAbs) return fDot < 0 ? 1.3 : 1.1;
  return 1.4;
}

function accidentShake(sev: "minor" | "moderate" | "severe"): void {
  const s = settings();
  const shake =
    sev === "minor" ? s.screenShakeMinor
    : sev === "moderate" ? s.screenShakeModerate
    : s.screenShakeSevere;
  ShakeGameplayCam("SMALL_EXPLOSION_SHAKE", shake);
}

function severityOf(deltaV: number, mult: number, s: VehicleDamageSettings): "minor" | "moderate" | "severe" {
  const dv = deltaV * mult;
  if (dv >= s.severeDeltaV) return "severe";
  if (dv >= s.moderateDeltaV) return "moderate";
  return "minor";
}

// ---------- Damage application ----------

function applyImpact(veh: number, sev: "minor" | "moderate" | "severe"): void {
  const s = settings();
  const mult = s.globalSeverity;

  // Engine damage
  const engineHit = sev === "minor" ? s.engineHitMinor : sev === "moderate" ? s.engineHitModerate : s.engineHitSevere;
  const engHp = GetVehicleEngineHealth(veh);
  SetVehicleEngineHealth(veh, Math.max(0, engHp - engineHit * mult));

  // Body damage
  const bodyHit = sev === "minor" ? s.bodyHitMinor : sev === "moderate" ? s.bodyHitModerate : s.bodyHitSevere;
  const bodyHp = GetVehicleBodyHealth(veh);
  SetVehicleBodyHealth(veh, Math.max(0, bodyHp - bodyHit * mult));

  // Power loss
  const powerLoss = sev === "minor" ? s.powerLossMinor : sev === "moderate" ? s.powerLossModerate : s.powerLossSevere;
  torqueMul = Math.max(0.2, torqueMul - powerLoss);

  // Localized deformation
  const intensity = sev === "minor" ? 50 : sev === "moderate" ? 120 : 250;
  const [px = 0, py = 0, pz = 0] = GetOffsetFromEntityInWorldCoords(veh, 0, 0, 0) as [number, number, number];
  SetVehicleDamage(veh, px, py, pz, intensity, 100, true);

  accidentShake(sev);

  // Eject the driver on hard impacts (thrown through the windshield).
  if (sev !== "minor" && prob(sev === "severe" ? 0.7 : 0.25)) {
    const ped = PlayerPedId();
    const curSpeed = GetEntitySpeed(veh);
    if (curSpeed > 4) {
      (async () => {
        ClearPedTasksImmediately(ped);
        SetPedCanBeKnockedOffVehicle(ped, 1);
        TaskLeaveVehicle(ped, veh, 4160);
        await sleep(100);
        const [vx = 0, vy = 0, vz = 0] = GetEntityVelocity(veh) as [number, number, number];
        if (!IsPedInAnyVehicle(ped, false)) {
          SetEntityVelocity(ped, vx * 1.4, vy * 1.4, vz * 0.6 + 4);
          SetPedToRagdoll(ped, 8000, 8000, 0, true, true, false);
          // Die when the ped comes to a standstill (hits the ground).
          let waited = 0;
          while (waited < 8000) {
            await sleep(200);
            waited += 200;
            if (!DoesEntityExist(ped)) return;
            const speed = GetEntitySpeed(ped);
            if (speed < 0.5 && waited > 500) {
              SetEntityHealth(ped, 0);
              return;
            }
          }
          if (DoesEntityExist(ped)) SetEntityHealth(ped, 0);
        }
      })();
    }
  }

  // Tyre burst
  if (sev !== "minor" && prob(sev === "severe" ? 0.8 : 0.4)) {
    const wheel = Math.floor(Math.random() * GetVehicleNumberOfWheels(veh));
    SetVehicleTyreBurst(veh, wheel, true, 1000);
    const curSpeed = GetEntitySpeed(veh);
    SetVehicleForwardSpeed(veh, curSpeed * 0.3);
    SetVehicleMaxSpeed(veh, 5.0);
    torqueMul = Math.max(0.15, torqueMul - 0.3);
    (async () => {
      await sleep(3000);
      SetVehicleMaxSpeed(veh, 0);
    })();
  }

  // Window shatter
  if (prob(sev === "severe" ? 0.95 : sev === "moderate" ? 0.65 : 0.25)) {
    SmashVehicleWindow(veh, Math.floor(Math.random() * 8));
  }

  // Door break
  if (sev !== "minor" && prob(sev === "severe" ? 0.5 : 0.18)) {
    SetVehicleDoorBroken(veh, Math.floor(Math.random() * 6), false);
  }

  // Light fail
  if (prob(sev === "severe" ? 0.75 : 0.3)) {
    SetVehicleLights(veh, 2);
  }
}

function handleSmokeAndFire(veh: number, s: VehicleDamageSettings): void {
  const engHp = GetVehicleEngineHealth(veh);
  if (engHp < s.fireAtEngineHP) {
    // engine critical; visual fire handled by game state
  }
}

function handleRepairReset(veh: number, st: VehState, engHp: number, bodyHp: number): void {
  if (engHp - st.lastEngHp > 300 || bodyHp - st.lastBodyHp > 300) {
    torqueMul = 1.0;
    vehState.delete(veh);
  }
}

// ---------- Main tick ----------

function mainTick(): void {
  const ped = PlayerPedId();
  let veh = 0;
  if (IsPedInAnyVehicle(ped, false)) {
    const v = GetVehiclePedIsIn(ped, false);
    if (GetPedInVehicleSeat(v, -1) === ped) veh = v;
  }
  if (veh === 0) return;

  const s = settings();
  const st = getVehState(veh);

  const vel = GetEntityVelocity(veh) as [number, number, number];
  const relVel = { x: vel[0] - st.lastVel[0], y: vel[1] - st.lastVel[1], z: vel[2] - st.lastVel[2] };
  const deltaV = Math.hypot(relVel.x, relVel.y, relVel.z);

  const engHp = GetVehicleEngineHealth(veh);
  const bodyHp = GetVehicleBodyHealth(veh);

  const minor = s.minorDeltaV, moderate = s.moderateDeltaV, severe = s.severeDeltaV;
  if (deltaV >= minor) {
    const mult = impactAngleMultiplier(veh, relVel);
    const sev = severityOf(deltaV, mult, s);
    applyImpact(veh, sev);
  }

  handleSmokeAndFire(veh, s);
  SetVehicleEngineTorqueMultiplier(veh, torqueMul);
  handleRepairReset(veh, st, engHp, bodyHp);

  st.lastEngHp = engHp;
  st.lastBodyHp = bodyHp;
  st.lastVel = [vel[0], vel[1], vel[2]];
}

// ---------- Schedulers ----------

const damageJob = every(50, () => mainTick(), { active: false, name: "vehicleDamage" });
every(1000, () => {
  const ped = PlayerPedId();
  damageJob.set(IsPedInAnyVehicle(ped, false));
}, { active: true, name: "vehicleDamageToggle" });

// ---------- Tire repair ----------

onNet("mb-vehicledamage:repairTires", async () => {
  const ped = PlayerPedId();
  let veh = 0;
  if (IsPedInAnyVehicle(ped, false)) {
    const v = GetVehiclePedIsIn(ped, false);
    if (GetPedInVehicleSeat(v, -1) === ped) veh = v;
  }
  if (veh === 0) {
    const pc = GetEntityCoords(ped, true) as [number, number, number];
    veh = GetClosestVehicle(pc[0], pc[1], pc[2], 3.0, 0, 70) as number;
  }
  if (veh === 0) return;

  const done = await progress({
    label: "Repairing tire",
    duration: 25000,
    anim: { dict: "amb@world_human_bum_wash@male@low@idle_a", clip: "idle_a", flag: 1 },
    canCancel: true,
    freeze: true,
    disable: { move: true, combat: true },
  });

  if (!done) return;

  const count = GetVehicleNumberOfWheels(veh);
  for (let i = 0; i < count; i++) SetVehicleTyreFixed(veh, i);
});
