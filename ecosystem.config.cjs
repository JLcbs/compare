module.exports = {
  apps: [{
    name: 'text-diff-mvp',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/user/webapp/text-diff-mvp',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    watch: false,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};