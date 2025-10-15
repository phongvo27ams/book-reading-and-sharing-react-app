import { Route, Routes, useLocation } from 'react-router-dom'
import DefaultLayout from './components/Layout/DefaultLayout/DefaultLayout'
import BooksPage from './pages/BooksPage/BooksPage'
import AuthLayout from './components/Layout/AuthLayout/AuthLayout'
import LoginPage from './pages/LoginPage/LoginPage'
import SigninPage from './pages/SigninPage/SigninPage'
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage'
import BookDetailPage from './pages/BookDetailPage/BookDetailPage'
import DashboardLayout from './components/Layout/DashboardLayout/DashboardLayout'
import ExploreLayout from './components/Layout/ExploreLayout/ExploreLayout'
import ExplorePage from './pages/ExplorePage/ExplorePage'
import ResultPage from './pages/ResultPage/ResultPage'
import { useEffect } from 'react'
import OAuth2SuccessPage from './pages/OAuth2SuccessPage/OAuth2SuccessPage'
import LoginGuard from './components/LoginGuard/LoginGuard'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]); 

  return (
    <div>
        <Routes>
          <Route path='/' element={<DefaultLayout><BooksPage/></DefaultLayout>}/>
          <Route path='/oauth2-success' element={<OAuth2SuccessPage/>}/>
          
          <Route path='/auth/login' element={
            <LoginGuard>
              <AuthLayout context='login'><LoginPage/></AuthLayout>
            </LoginGuard>
          }/>
          <Route path='/auth/signin' element={
            <LoginGuard>
              <AuthLayout context='signup'><SigninPage/></AuthLayout>
            </LoginGuard>
          }/>
          <Route path='/auth/reset-password' element={
            <LoginGuard>
              <AuthLayout context='reset'><ResetPasswordPage/></AuthLayout>
            </LoginGuard>
          }/>
          <Route path='/book/detail' element={
            <ProtectedRoute>
              <DefaultLayout><BookDetailPage/></DefaultLayout>
            </ProtectedRoute>
          }/>
          <Route path='/dashboard' element={
            <ProtectedRoute>
              <DashboardLayout></DashboardLayout>
            </ProtectedRoute>
          }/>
          <Route path='/explore' element={
            <ProtectedRoute>
              <ExploreLayout><ExplorePage/></ExploreLayout>
            </ProtectedRoute>
          }/>
          <Route path='/explore/result' element={
            <ProtectedRoute>
              <ExploreLayout><ResultPage/></ExploreLayout>
            </ProtectedRoute>
          }/>
        </Routes>
    </div>
  )
}

export default App