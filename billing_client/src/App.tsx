import { Fragment } from 'react'
import './style/main_style.css'
import AppRouter from './routes/AppRouter'
import { ToastContainer } from 'react-toastify'
import AppDialog from './components/AppDialog'

export default function App() {
  return (
    <Fragment>
      <ToastContainer />
      <AppDialog />
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <AppRouter />
      </div>
    </Fragment>
  )
}
