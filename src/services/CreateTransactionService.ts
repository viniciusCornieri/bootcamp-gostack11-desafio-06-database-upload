import { getRepository, getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
  validateBalance?: boolean;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryTitle,
    validateBalance = true,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    let category = await categoryRepository.findOne({ title: categoryTitle });
    if (!category) {
      category = categoryRepository.create({ title: categoryTitle });
      await categoryRepository.save(category);
    }

    const transactionRepository = getCustomRepository(TransactionsRepository);

    const currentBalance = await transactionRepository.getBalance();

    if (validateBalance && type === 'outcome' && currentBalance.total < value) {
      throw new AppError(
        'Cannot create an outcome without a valid balance',
        400,
      );
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category,
    });
    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
