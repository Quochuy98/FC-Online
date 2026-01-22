/**
 * Vercel Serverless Function Entry Point
 * Wraps Express app for Vercel deployment
 */

const { app } = require('../server/api');

module.exports = app;
