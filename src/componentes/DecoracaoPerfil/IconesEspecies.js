import React from "react";
import Svg, { G, Path, Circle, Ellipse } from "react-native-svg";
import { useTema } from "../../styles/TemaContext";

export default function IconesEspecies({ especie, tamanho = 40, cor }) {
    const { cores } = useTema();

    const corPrincipal = cor || cores.laranja;
    const animal = especie?.toLowerCase().trim();

    const temGarras = ["gato", "furão"].includes(animal);
    const ehPassaro = ["calopsita", "periquito", "canário", "papagaio", "outro tipo de pássaro"].includes(animal);

    return (
        <Svg width={tamanho} height={tamanho} viewBox="-5 -15 80 85">
            <G fill={corPrincipal}>

                {(["cachorro", "gato", "furão"].includes(animal)) ? (
                    <>
                        <Ellipse cx={9} cy={25} rx={8} ry={11} />
                        <Ellipse cx={23} cy={12} rx={8} ry={11} />
                        <Ellipse cx={40} cy={12} rx={8} ry={11} />
                        <Ellipse cx={54} cy={25} rx={8} ry={11} />

                        <Path d="M12 48 Q10 37 24 29 Q32 24 42 32 Q58 42 50 53 Q45 60 32 53 Q18 61 12 48Z" />

                        {temGarras && (
                            <Path d="M3 12 L1 3 L10 10Z M19 -2 L21 -12 L26 -2Z M36 -2 L42 -12 L44 -2Z M53 12 L63 3 L60 15Z" />
                        )}
                    </>
                ) : ehPassaro ? (
                    <>
                        <Path d="M9 51 C-2 24 31 -3 58 3 C62 30 33 57 9 51Z" />

                        <Path
                            d="M2 62 L48 13 M20 42 L15 23 M30 32 L48 33 M39 22 L34 10"
                            fill="none"
                            stroke={cores.marrom}
                            strokeWidth={3}
                        />
                    </>
                ) : animal === "peixe" ? (
                    <>
                        <Path d="M8 31 Q31 2 52 30 Q30 58 8 31Z M50 30 L66 12 L66 48Z" />
                        <Circle cx={19} cy={26} r={3} fill={cores.marrom} />
                    </>
                ) : animal === "coelho" ? (
                    <>
                        <Path d="M15 20 Q30 8 45 25 Q38 44 8 64 Q9 38 15 20Z" />
                        <Path d="M32 20 Q22 -4 29 0 Q43 6 39 20 M39 20 Q48 -4 55 4 Q58 15 39 20Z" />

                        <Path
                            d="M17 32 L27 36 M20 48 L12 44"
                            stroke={cores.marrom}
                            strokeWidth={3}
                        />
                    </>
                ) : animal === "tartaruga" ? (
                    <>
                        <Ellipse cx={31} cy={32} rx={23} ry={25} />
                        <Circle cx={31} cy={3} r={9} />
                        <Ellipse cx={6} cy={17} rx={7} ry={10} transform="rotate(-30 6 17)" />
                        <Ellipse cx={56} cy={17} rx={7} ry={10} transform="rotate(30 56 17)" />
                        <Ellipse cx={9} cy={49} rx={7} ry={10} />
                        <Ellipse cx={53} cy={49} rx={7} ry={10} />

                        <Path
                            d="M31 17 L45 25 L45 40 L31 48 L17 40 L17 25Z M31 17 L31 7 M45 25 L53 20 M45 40 L53 48 M31 48 L31 57 M17 40 L9 48 M17 25 L9 20"
                            stroke={cores.marrom}
                            strokeWidth={2}
                            fill="none"
                        />
                    </>
                ) : animal === "hamster" ? (
                    <>
                        <Path d="M32 0 Q4 17 17 43 Q32 65 47 43 Q60 17 32 0Z" />

                        <Path
                            d="M32 9 Q20 30 32 52"
                            stroke={cores.marrom}
                            strokeWidth={3}
                            fill="none"
                        />
                    </>
                ) : animal === "porquinho-da-índia" ? (
                    <>
                        <Path d="M7 49 Q0 5 60 3 Q62 55 7 49Z" />

                        <Path
                            d="M0 62 L47 15 M18 39 L13 21 M29 30 L46 34"
                            stroke={cores.marrom}
                            strokeWidth={3}
                            fill="none"
                        />
                    </>
                ) : (
                    <Path d="M32 55 L8 31 C-12 5 21 -7 32 15 C43 -7 76 5 56 31Z" />
                )}

            </G>
        </Svg>
    );
}