import express from 'express';
const app = express();
import logger from 'morgan';
import bug from 'debug'
const debug = bug('SIR');
const error = bug('SIR:error');

import hbs from 'express-handlebars';
import passport from 'passport';
import session from 'express-session';

import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import multer from 'multer';

const env = process.env;
const gaToken = env.GA_TOKEN;
const channel = env.SLACK_CHANNEL;
const botName = env.SLACK_BOT_NAME || 'SIR';
const nodeEnv = env.NODE;

import { exitWithError } from './lib/helpers';

if (!gaToken) {
  exitWithError('Please set GA_TOKEN environment variable.')
}

if (!env.CLIENT_ID) {
  exitWithError('Please set CLIENT_ID environment variable.')
}

if (!env.CLIENT_SECRET) {
  exitWithError('Please set CLIENT_SECRET environment variable.')
}

app.use(logger('dev'));

app.engine('.hbs', hbs({
  defaultLayout: 'main',
  extname: '.hbs',
  partialsDir: ['./views/partials/']
}));
app.set('view engine', '.hbs');
app.set('views', './views');

app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: env.SESSION_SECRET || '(\/)(;,,;)(\/) wooop woop woop'
  }),
  cookieParser(),
  bodyParser.urlencoded({ extended: true }),
  bodyParser.json(),
  multer(),
  passport.initialize(),
  passport.session(),
  (req, res, next) => {
    req.originUri = req.protocol + '://' + req.get('host');
    next();
  }
);

import apply from './routes/apply';
import home from './routes/home';
import signin from './routes/signin';
import thanks from './routes/thanks';
app.use('/apply', apply);
app.use('/', home);
app.use('/signin', signin);
app.use('/thanks', thanks);

import auth from './lib/auth';
app.use('/auth', auth);

app.use((err, req, res, next) => {
  error(err.stack);
  res.status(500).send('Internal Server Error');
});

app.use(express.static('public', {
  index: false
}));

const server = app.listen(process.env.PORT || 3000, () => {
  const host = server.address().address;
  const port = server.address().port;

  debug('Slack Invite Request listening at http://%s:%s', host, port);
});
