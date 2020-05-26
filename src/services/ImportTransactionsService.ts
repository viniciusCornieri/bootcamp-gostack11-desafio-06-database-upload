import csvParse from 'csv-parse';
import fs from 'fs';

import { getRepository, In } from 'typeorm';
import CreateTransactionService from './CreateTransactionService';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import Category from '../models/Category';

interface CSVLine {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryTitle: string;
}
class ImportTransactionsService {
  public async execute(csvFilePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionLines: CSVLine[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, categoryTitle] = line;

      if (type !== 'income' && type !== 'outcome') {
        throw new AppError('Type must be income or outcome');
      }

      transactionLines.push({
        title,
        type,
        value: parseFloat(value),
        categoryTitle,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    readCSVStream.close();

    await fs.promises.unlink(csvFilePath);

    const createTransaction = new CreateTransactionService();
    const transactions: Transaction[] = [];

    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < transactionLines.length; index++) {
      const transactionRequest = transactionLines[index];
      // eslint-disable-next-line no-await-in-loop
      const transaction = await createTransaction.execute(transactionRequest);

      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
