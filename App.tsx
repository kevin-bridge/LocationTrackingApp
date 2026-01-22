import React from 'react';
import {StatusBar, Platform} from 'react-native';
import {Provider} from 'react-redux';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import {store} from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  // Removed auto-restore authentication - users must login manually each time
  // useEffect(() => {
  //   // Restore authentication state on app start
  //   const restoreAuth = async () => {
  //     const token = await StorageService.getAuthToken();
  //     const user = StorageService.getUserData();

  //     if (token && user) {
  //       store.dispatch(setUser({user, token}));
  //     }
  //   };

  //   restoreAuth();
  // }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'light-content' : 'default'}
          backgroundColor="#4CAF50"
        />
        <AppNavigator />
        <Toast />
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
