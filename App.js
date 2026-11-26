import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SQLiteProvider } from 'expo-sqlite';
import { TemaProvider } from './src/styles/TemaContext';

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

import AlertaTutus from './src/componentes/AlertaTutus';

import { useState, useEffect } from 'react';
 /* importa dois hooks do react; o primeiro guarda/atualiza um valor durante a execução do componente e o segundo executa uma ação quando ele é carregado.*/
import * as Font from 'expo-font';
/* importa o expo-font, biblioteca usada para carregar fontes personalizadas no aplicativo. */

const Stack = createNativeStackNavigator(); /* cria o navegador responsável pela sequencia das telas. */

export default function App() {
  const [fonteCarregada, setFonteCarregada] = useState(false); /* cria um estado para verficicar se a fonte já terminou de carregar; false no inicio porque não foi carregada ainda.*/

  useEffect(() => {
    async function carregarFonte() { /* função responsável por carregar.*/
      try {
        await Font.loadAsync({
          'Ruwudu-Regular': require('./assets/fonts/Ruwudu-Regular.ttf'),
          'Ruwudu-Bold': require('./assets/fonts/Ruwudu-Bold.ttf'),
        });/* carrega o arquivo da fonte e define o nome p/ utilizá-la nos estilos.*/

        setFonteCarregada(true);
        /* depois que é carregada, o estado vira true.*/
      } catch (erro) {
        console.error("Erro ao carregar fontes:", erro);
      }
    }

    carregarFonte(); /* chama a função que carrega a fonte.*/

  }, []); /* o [] faz o efeito carregar apenas quando o componente for carregado.*/

  if (!fonteCarregada) {
    return null;
  }/* enquanto a fonte não terminar de carregar, a tela não é exibida; para evitar que o texto apareça primeiramente com a fonte padrão.*/

  return (

    <SQLiteProvider
      databaseName="tutus.db"
      onInit={inicializarBanco}
    >

       <TemaProvider>

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

      <AlertaTutus />

      </TemaProvider>

    </SQLiteProvider >
  )
}