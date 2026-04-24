require('dotenv').config();
const express = require('express');
const electionsRouter = require('./routes/elections');
const candidatesRouter = require('./routes/candidates');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use('/api/elections', electionsRouter);
app.use('/api/candidates', candidatesRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ZKVote backend running on port ${PORT}`);
});
