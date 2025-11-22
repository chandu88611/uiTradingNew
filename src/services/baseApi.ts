import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'https://jsonplaceholder.typicode.com/'
  }),
  tagTypes: ['Todos'],
  endpoints: () => ({})
})
