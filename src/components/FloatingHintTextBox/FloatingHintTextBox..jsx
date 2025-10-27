import { useId, useState } from 'react'
import style from './FloatingHintTextBox.module.css'
import classNames from 'classnames/bind'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

const clx = classNames.bind(style)

function FloatingHintTextBox({value, type, onChange, hint, "data-testid": dataTestId}){
    const id = useId()
    const [show, setShow] = useState(false)
    const [tempType, setTempType] = useState(type)

    const handleShowPassword = () => {
        setShow(prev => {
            const nextShow = !prev
            setTempType(nextShow ? 'text' : 'password')
            return nextShow
        })
    }

    return (
        <div className={clx('floating-hint-textbox')}>
            <input id={id} type={tempType} onChange={onChange} required value={value} data-testid={dataTestId} />
            <label htmlFor={id} className={clx('hint')}>{hint}</label>
            {type == 'password' && 
            <span className={clx('eye')} onClick={handleShowPassword}>
                <FontAwesomeIcon icon={show ? faEyeSlash : faEye}/>
            </span>}
        </div>
    )
}

export default FloatingHintTextBox