export type Expense = {
  id: string
  amount: number
  date: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type Payment = {
  id: string
  amount: number
  date: string
  note: string | null
  createdAt: string
}

export type Balance = {
  id: 'current'
  due: number
  updatedAt: string
}

export type ExpenseResponse = Expense & { balanceDue: number }
export type PaymentResponse = Payment & { balanceDue: number }
