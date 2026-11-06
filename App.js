import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SQLiteProvider } from 'expo-sqlite';

import Splash from './src/screens/Splash';
import Welcome from './src/screens/Welcome';
import Login from './src/screens/Login';
import ListaPets from './src/screens/ListaPets';
import MainTabs from "./src/navigation/MainTabs";
import CadastroPets from "./src/screens/CadastroPets";
import CriarConta from "./src/screens/CriarConta";
import EsqueceuSenha from "./src/screens/EsqueceuSenha";
import VerificarCodigo from "./src/screens/VerificarCodigo";
import NovaSenha from "./src/screens/NovaSenha";

import { inicializarBanco } from './src/database/Database';

const Stack = createNativeStackNavigator(); /* cria o navegador responsável pela sequencia das telas. */

export default function App() {
  return (

    <SQLiteProvider
      databaseName="tutus.db"
      onInit={inicializarBanco}
    >

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
            name="ListaPets"
            component={ListaPets}
          />

          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
          />

          <Stack.Screen
            name="CadastroPets"
            component={CadastroPets}
          />

          <Stack.Screen
            name="CriarConta"
            component={CriarConta}
          />

          <Stack.Screen
            name="EsqueceuSenha"
            component={EsqueceuSenha}
          />

          <Stack.Screen
            name="VerificarCodigo"
            component={VerificarCodigo}
          />

          <Stack.Screen
            name="NovaSenha"
            component={NovaSenha}
          />

        </Stack.Navigator>

      </NavigationContainer>

    </SQLiteProvider >
  )
}