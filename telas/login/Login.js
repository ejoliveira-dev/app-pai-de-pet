import React from "react";
import {Text, View, Image, TextInput, TouchableOpacity} from 'react-native';
import { style } from "./styles";
import logo from "../../img/logo-ofc-png.png";


export default function Login (){
    return(
        <View style={style.container}>
                <View style={style.boxTop}>
                    <Image 
                    source={logo}
                    style={style.logo}
                    resizeMode="contain"
                    />
                </View>

                <View style={style.boxMid}>
                     <TextInput
                     placeholder="Endereço de E-mail"
                     style={style.input}
                
                    />

                     <TextInput
                     secureTextEntry={true}
                     placeholder="Senha"
                     style={style.input}
                     />
                 </View>

                <View style={style.boxBottom}>
                <TouchableOpacity style={style.botao}>
                <Text style={style.textoBotao}>Entrar</Text>
                </TouchableOpacity>

                               <View style={style.contaContainer}>
                    <Text>Não tem uma conta? </Text>
                    <Text style={style.linkCriarConta}>
                        Criar conta
                    </Text>
                </View>
            </View>
        </View>
    );
}