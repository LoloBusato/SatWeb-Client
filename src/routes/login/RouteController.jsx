import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import axios from 'axios'
import SERVER from '../server'

const RouteController = ({ children }) => {

    // Chequeo sincrónico al primer render: si no hay userId en localStorage
    // (incógnito, session expirada, storage limpio), `isAuth` arranca en false
    // y <Navigate> redirige a /login sin montar el <Outlet />. Evita que
    // componentes hijos (Home, Stock, etc.) se rendereen con localStorage
    // vacío y crasheen al hacer `.includes()` sobre permisos/grupoId null.
    const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem("userId"))
    const [users, setUsers] = useState([])

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/users`)
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