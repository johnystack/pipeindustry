import { Transaction, User } from '@/lib/types';

interface WithdrawalReceiptProps {
  transaction: Transaction;
  user: User;
}

const WithdrawalReceipt = ({ transaction, user }: WithdrawalReceiptProps) => {
  return (
    <div className="p-8 bg-white rounded-lg shadow-md text-black">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-black">Pipe Industry</h1>
        <h2 className="text-xl font-bold text-black">Withdrawal Receipt</h2>
        <p className="text-gray-500">Transaction ID: {transaction.id}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8 text-black">
        <div>
          <p className="font-bold">User Details</p>
          <p>{user.first_name} {user.last_name}</p>
          <p>{user.email}</p>
        </div>
        <div>
          <p className="font-bold">Transaction Details</p>
          <p>Amount: ${transaction.amount}</p>
          <p>Date: {new Date(transaction.created_at).toLocaleDateString()}</p>
          <p>Status: {transaction.status}</p>
        </div>
      </div>
      <div className="text-center text-gray-500">
        <p>Thank you for your transaction.</p>
      </div>
    </div>
  );
};

export default WithdrawalReceipt;
