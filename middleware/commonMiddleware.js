const bodyParser = require('body-parser');
const nocache = require('nocache');
const express = require('express');

const commonMiddleware = (app) => {
  app.use(nocache());
  app.use(express.json());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
};

module.exports = { commonMiddleware };
