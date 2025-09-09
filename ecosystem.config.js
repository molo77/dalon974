module.exports = {
  apps: [{
    name: 'rodcoloc',
    script: 'npm',
    args: 'start',
    cwd: '/data/rodcoloc',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}