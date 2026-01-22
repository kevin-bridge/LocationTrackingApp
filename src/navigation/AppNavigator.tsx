import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {RootState} from '../store';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ConfirmSignupScreen from '../screens/ConfirmSignupScreen';
import MapScreen from '../screens/MapScreen';
import HistoryScreen from '../screens/HistoryScreen';
import JourneyDetailScreen from '../screens/JourneyDetailScreen';
import {Colors, Typography} from '../theme';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const {isAuthenticated} = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.white,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.borderLight,
          },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: {
            fontWeight: Typography.semibold,
            fontSize: Typography.h4,
          },
          headerBackTitleVisible: false,
          cardStyle: {
            backgroundColor: Colors.background,
          },
        }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="ConfirmSignup"
              component={ConfirmSignupScreen}
              options={{headerShown: false}}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Map"
              component={MapScreen}
              options={{
                title: 'Journey Tracking',
                headerLeft: () => null,
              }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{
                title: 'History',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="JourneyDetail"
              component={JourneyDetailScreen}
              options={{
                title: 'Journey Details',
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
