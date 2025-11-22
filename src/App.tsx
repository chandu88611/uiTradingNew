import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from './store'
import { inc, dec, reset } from './slices/counterSlice'
import { useGetTodosQuery, useAddTodoMutation } from './services/todosApi'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BrowserRouter } from "react-router-dom";
import Router from "./Router";
export default function App() {
  const count = useSelector((s: RootState) => s.counter.value)
  const dispatch = useDispatch()
  const { data = [], isFetching, refetch } = useGetTodosQuery()
  const [addTodo, { isLoading: adding }] = useAddTodoMutation()
  const [title, setTitle] = useState('Learn RTK Query')

  return ( 
  <>
  <ToastContainer
position="top-right"
autoClose={5000}
hideProgressBar={false}
newestOnTop={false}
closeOnClick
rtl={false}
pauseOnFocusLoss
draggable
pauseOnHover
theme="light"
/>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
  </>
  )
}
