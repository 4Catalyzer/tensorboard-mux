#!/usr/bin/env node

import 'babel-polyfill';

// Split out the server module to make sure babel-preset-env useBuiltIns
// imports the built-ins before any of our code runs.
import './server';
