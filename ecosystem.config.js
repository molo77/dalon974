module.exports = {
  apps: [{
    name: 'dalon974',
    script: 'npm',
    args: 'start',
    cwd: '/data/dalon974',
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