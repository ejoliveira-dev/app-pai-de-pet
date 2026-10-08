import { Dimensions, StyleSheet } from "react-native";

export const style = StyleSheet.create({

    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    boxTop: {
        height: Dimensions.get('window').height / 3,
        backgroundColor: '#ffffff',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },

    boxMid: {
        height: Dimensions.get('window').height / 4,
        backgroundColor: '#ffffff',
        width: '100%',
        alignItems:'center'
    },

    boxBottom: {
        height: Dimensions.get('window').height / 3,
        backgroundColor: '#ffffff',
        width: '100%'
    },

    logo: {
        width: 150,
        height: 150
    },
    
    input: {
    width: '90%',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    marginBottom: 25,
},
button:{

}
})