import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Splash from './src/screens/Splash';
import Welcome from './src/screens/Welcome';
import Login from './src/screens/Login';
import Home from './src/screens/Home';

const Stack = createNativeStackNavigator(); /* cria o navegador responsável pela sequencia das telas. */

export default function App() {
  return (

    <NavigationContainer> 
    {/* controla a navegação do app.*/}

      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        {/* quando o app abrir, comece pela tela splash, basicamente.*/}

        <Stack.Screen
          name="Splash"
          component={Splash}
        />

        {/* registra a segunda tela no sistema do  aplicativo. */}
        <Stack.Screen
          name="Welcome"
          component={Welcome}
        />

        <Stack.Screen
          name="Login"
          component={Login}
        />

        <Stack.Screen
          name="Home"
          component={Home}
        />
      </Stack.Navigator>

    </NavigationContainer>

  )
}