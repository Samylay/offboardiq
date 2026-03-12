require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'anthropic',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || 'claude-sonnet-4-6',
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@offboardiq.com',
  },

  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION || 'us-east-1',
  },

  offboarding: {
    defaultWindowDays: parseInt(process.env.DEFAULT_OFFBOARD_WINDOW, 10) || 14,
    reminderFrequencyHours: parseInt(process.env.REMINDER_FREQ_HOURS, 10) || 24,
    knowledgeScoreThreshold: parseFloat(process.env.KNOWLEDGE_SCORE_THRESHOLD) || 0.7,
  },
};
