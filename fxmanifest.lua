name 'mb-vehicledamage'
author 'MisterBuzzee'
version '0.1.0' -- x-release-please-version
license 'GPL-3.0-only'
description 'Ultra realistic vehicle damage simulation (client-side)'
repository 'https://github.com/MisterBuzzee/mb-vehicledamage'
fx_version 'cerulean'
game 'gta5'
node_version '22'

client_script 'dist/client.js'
server_script 'dist/server.js'


dependencies {
	'ai-core',
}

files {
	'locales/*.json',
}
