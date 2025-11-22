import { baseApi } from './baseApi'

export interface Todo {
  id: number
  title: string
  completed: boolean
}

export const todosApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTodos: builder.query<Todo[], void>({
      query: () => `todos?_limit=5`,
      providesTags: ['Todos']
    }),
    addTodo: builder.mutation<Todo, Partial<Todo>>({
      query: (body) => ({
        url: `todos`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Todos']
    })
  })
})

export const { useGetTodosQuery, useAddTodoMutation } = todosApi
