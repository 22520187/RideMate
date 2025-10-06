import {useEffect, useState} from 'react'
import {Keyboard, Platform} from 'react-native'

export function useIsKeyboardVisible() {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false)

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const keyboardDidShowListener = Keyboard.addListener(showEvent, () => {
            setKeyboardVisible(true);
        });

        const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    return { isKeyboardVisible };
}