import { http } from 'msw'
import { db } from '../data/db'
import { ok } from '../response'
import { paginateArray, parsePaginationParams } from '../utils'

export const scoreHandlers = [
  http.get('*/api/score/logs', ({ request }) => {
    const { page, pageSize } = parsePaginationParams(request.url)
    const paginated = paginateArray(db.scoreLogs, page, pageSize)
    const totalIncome = db.scoreLogs.filter(l => l.delta > 0).reduce((sum, l) => sum + l.delta, 0)
    const totalExpense = db.scoreLogs.filter(l => l.delta < 0).reduce((sum, l) => sum + Math.abs(l.delta), 0)

    return ok({
      total: db.scoreLogs.length,
      total_income: totalIncome,
      total_expense: totalExpense,
      list: paginated,
    })
  }),
]
