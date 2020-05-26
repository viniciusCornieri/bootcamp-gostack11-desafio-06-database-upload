import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  private getTransactionTypeSubTotal(
    transactions: Transaction[],
    type: 'income' | 'outcome',
  ): number {
    return transactions
      .filter(transaction => transaction.type === type)
      .map(transaction => transaction.value)
      .reduce((total, value) => total + value, 0);
  }

  public async getBalance(): Promise<Balance> {
    const allTransactions = await this.find();

    const income = this.getTransactionTypeSubTotal(allTransactions, 'income');
    const outcome = this.getTransactionTypeSubTotal(allTransactions, 'outcome');

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;
