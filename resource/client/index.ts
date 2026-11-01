import { AdminWorld, progress } from "@aicore-fivem/lib/client";
import { sleep } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import { readSettings, type VehicleDamageSettings } from "common/vehicleDamage";

const world = new AdminWorld(["settings"]);
const content = { settings: world.view("settings", readSettings) };
function settings(): VehicleDamageSettings {
  return content.settings?.value ?? {
    globalSeverity: 1.1, minorDeltaV: 3.5, moderateDeltaV: 7, severeDeltaV: 12,
    powerLossMinor: 0.12, powerLossModerate: 0.3, powerLossSevere: 0.6,
    engineHitMinor: 60, engineHitModerate: 200, engineHitSevere: 450,
    bodyHitMinor: 80, bodyHitModerate: 220, bodyHitSevere: 450,
    smokeAtEngineHP: 450, fireAtEngineHP: 220,
    screenShakeMinor: 0.25, screenShakeModerate: 0.55, screenShakeSevere: 0.95,
  };
}

// State per vehicle
const vehState = new Map<number, { lastSpeed: number; lastEngHp: number; lastBodyHp: number; lastVel: [number, number, number] }>();
let torqueMul = 1.0;

function clamp(x: number, a: number, b: number) { return Math.max(a, Math.min(b, x)); }
function prob(p: number) { return Math.random() < p; }

function getVehState(v: number) {
  let st = vehState.get(v);
  if (!st) { st = { lastSpeed: 0, lastEngHp: 1000, lastBodyHp: 1000, lastVel: [0, 0, 0] }; vehState.set(v, st); }
  return st;
}

function impactAngleMultiplier(v: number, relVel: { x: number; y: number; z: number }) {
  const fw = GetEntityForwardVector(v) as [number, number, number];
  const [fx, fy, fz] = fw;
  const right = { x: fy, y: -fx, z: fz };
  const fDot = fx * relVel.x + fy * relVel.y + fz * relVel.z;
  const rDotAbs = Math.abs(right.x * relVel.x + right.y * relVel.y + right.z * relVel.z);
  if (Math.abs(fDot) >= rDotAbs) return fDot < 0 ? 1.3 : 1.1;
  return 1.4;
}

function accidentShake(sev: "minor" | "moderate" | "severe") {
  const s = settings();
  const shake = sev === "minor" ? s.screenShakeMinor : sev === "moderate" ? s.screenShakeModerate : s.screenShakeSevere;
  ShakeGameplayCam("SMALL_EXPLOSION_SHAKE", shake);
}

function mainTick() {
  const ped = PlayerPedId();
  let veh = 0;
  if (IsPedInAnyVehicle(ped, false)) {
    const v = GetVehiclePedIsIn(ped, false);
    if (GetPedInVehicleSeat(v, -1) === ped) veh = v;
  }
  if (veh === 0) return;

  const s = settings();
  const st = getVehState(veh);
  const [vx = 0, vy = 0, vz = 0] = GetEntityCoords(veh, false);
  const speed = GetEntitySpeed(veh);
  const vel = GetEntityVelocity(veh) as [number, number, number];
  const relVel = { x: vel[0] - st.lastVel[0], y: vel[1] - st.lastVel[1], z: vel[2] - st.lastVel[2] };
  const deltaV = Math.hypot(relVel.x, relVel.y, relVel.z);

  const engHp = GetVehicleEngineHealth(veh);
  const bodyHp = GetVehicleBodyHealth(veh);

  // Detect new impact
  const minor = s.minorDeltaV, moderate = s.moderateDeltaV, severe = s.severeDeltaV;
  if (deltaV >= minor) {
    const mult = impactAngleMultiplier(veh, relVel);
    const sev: "minor" | "moderate" | "severe" =
      deltaV * mult >= severe ? "severe" : deltaV * mult >= moderate ? "moderate" : "minor";
    const sevKey = sev;
    // Engine damage
    const engineHit = sev === "minor" ? s.engineHitMinor : sev === "moderate" ? s.engineHitModerate : s.engineHitSevere;
    const newEng = Math.max(0, engHp - engineHit * s.globalSeverity);
    SetVehicleEngineHealth(veh, newEng);
    // Body damage
    const bodyHit = sev === "minor" ? s.bodyHitMinor : sev === "moderate" ? s.bodyHitModerate : s.bodyHitSevere;
    const newBody = Math.max(0, bodyHp - bodyHit * s.globalSeverity);
    SetVehicleBodyHealth(veh, newBody);
    // Power loss
    const powerLoss = sev === "minor" ? s.powerLossMinor : sev === "moderate" ? s.powerLossModerate : s.powerLossSevere;
    torqueMul = Math.max(0.2, torqueMul - powerLoss);
    // Deform
    const intensity = sev === "minor" ? 50 : sev === "moderate" ? 120 : 250;
    const [px = 0, py = 0, pz = 0] = GetOffsetFromEntityInWorldCoords(veh, 0, 0, 0) as [number, number, number];
    SetVehicleDamage(veh, px, py, pz, intensity, 100, true);
    // Shake
    accidentShake(sev);
    // Tyre burst (side impacts)
    if (sev !== "minor" && prob(sev === "severe" ? 0.8 : 0.4)) {
      const wheel = Math.floor(Math.random() * GetVehicleNumberOfWheels(veh));
      SetVehicleTyreBurst(veh, wheel, true, 1000);
    }
    // Window shatter
    if (prob(sev === "severe" ? 0.95 : sev === "moderate" ? 0.65 : 0.25)) {
      // shatter a random window
      const w = Math.floor(Math.random() * 8);
      SmashVehicleWindow(veh, w);
    }
    // Door break
    if (sev !== "minor" && prob(sev === "severe" ? 0.5 : 0.18)) {
      const door = Math.floor(Math.random() * 6);
      SetVehicleDoorBroken(veh, door, false);
    }
    // Light fail
    if (prob(sev === "severe" ? 0.75 : 0.3)) {
      SetVehicleLights(veh, 2); // broken
    }
  }

  // Smoke / fire
  if (engHp < s.smokeAtEngineHP && engHp > s.fireAtEngineHP) {
    // smoke (visual via particle) - skip for simplicity
  }
  if (engHp < s.fireAtEngineHP) {
    // fire (visual handled by game; engine health already critical)
  }

  // Perf decay: apply torque multiplier
  SetVehicleEngineTorqueMultiplier(veh, torqueMul);

  // Auto repair reset detection
  if (engHp - st.lastEngHp > 300 || bodyHp - st.lastBodyHp > 300) {
    torqueMul = 1.0;
    vehState.delete(veh);
  }

  st.lastSpeed = speed;
  st.lastEngHp = engHp;
  st.lastBodyHp = bodyHp;
  st.lastVel = [vel[0], vel[1], vel[2]];
}

// Tick at ~10ms
setInterval(mainTick, 10);

// Tire repair via usable item.
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

  // Crouch first.
  RequestAnimSet("move_crouch_proto");
  let crouchTries = 0;
  while (!HasAnimSetLoaded("move_crouch_proto") && crouchTries < 100) {
    await sleep(10);
    crouchTries += 1;
  }
  if (HasAnimSetLoaded("move_crouch_proto")) {
    SetPedMovementClipset(ped, "move_crouch_proto", 0.5);
  }

  // Progress bar for 25 seconds (cancellable), with repair animation.
  const done = await progress({
    label: "Repairing tire",
    duration: 25000,
    anim: { dict: "mini@repair", clip: "fixing_a_player", flag: 1 },
    canCancel: true,
    freeze: true,
    disable: { move: true, combat: true },
  });

  ResetPedMovementClipset(ped, 0.5);

  if (!done) return;

  const count = GetVehicleNumberOfWheels(veh);
  for (let i = 0; i < count; i++) SetVehicleTyreFixed(veh, i);
});
