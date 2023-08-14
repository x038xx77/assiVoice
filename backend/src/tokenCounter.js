import fs from 'fs';
import { encode } from 'gpt-3-encoder';

const countsFolder = 'CountsGPT3TurboTokens'; // Имя папки для хранения файлов счетчиков

if (!fs.existsSync(countsFolder)) {
  fs.mkdirSync(countsFolder);
}

const queryCounterPath = `${countsFolder}/queryCounter.json`;
const requestCounterPath = `${countsFolder}/requestCounter.json`;

let queryCounterData = JSON.parse(fs.readFileSync(queryCounterPath));
let requestCounterData = JSON.parse(fs.readFileSync(requestCounterPath));

export function countAndTrackTokens(text, type) {
  const tokenCount = encode(text).length;

  if (type === 'query') {
    queryCounterData.counterQuery += tokenCount;
    fs.writeFileSync(queryCounterPath, JSON.stringify(queryCounterData, null, 2));
  } else if (type === 'request') {
    requestCounterData.counterRequest += tokenCount;
    fs.writeFileSync(requestCounterPath, JSON.stringify(requestCounterData, null, 2));
  }

  return tokenCount;
}

export function getTotalTokens(type) {
  if (type === 'query') {
    return queryCounterData.counterQuery;
  } else if (type === 'request') {
    return requestCounterData.counterRequest;
  }
}


