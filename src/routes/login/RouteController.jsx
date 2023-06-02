import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import axios from 'axios'

const RouteController = ({ children }) => {

    const [isAuth, setIsAuth] = useState(true)
    const [users, setUsers] = useState([])

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get('http://localhost:3001/users')
                .then(response => {
                    setUsers(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()

        const init = async () => {
            if (!localStorage.getItem("userId")) {
                setIsAuth(false)
            } else {
                const auth = JSON.parse(localStorage.getItem("userId"))
                let i = 0
                while (isAuth && i < users.length ){
                    if (users[i].idusers === auth){
                        setIsAuth(true)
                    }
                    i += 1
                }
            }
        }
        init()
    // eslint-disable-next-line
    }, [])
    
    return isAuth ? <Outlet /> : <Navigate to='/login' />
}

export default RouteController