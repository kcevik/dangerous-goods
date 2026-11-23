// GENERATED FILE — DO NOT EDIT.
// Written by scripts/generate-demo-data.ts (`pnpm generate:demo`) on 2026-11-23.
// UN 1203, sequence 1, read from the live BAM tables through the app's own mapper
// (fetchCompareForUn) plus the special-provision texts. Rerun after every import or mapper change.
// Source: BAM GEFAHRGUT database, dl-de/by-2-0.

import type { Entry, SvText } from './types'

export const DEMO_DATA: Record<string, Entry[]> = {
  "ADR": [
    {
      "unNumber": "1203",
      "sequenceNumber": 1,
      "name": "BENZIN",
      "nameEn": "MOTOR SPIRIT",
      "nameFr": "ESSENCE",
      "hazardClass": "3",
      "classificationCode": "F1",
      "packingGroup": "II",
      "hazardLabels": "3",
      "exceptedQty": "E2",
      "limitedQty": "1 L",
      "transportCategory": "2",
      "multiplier": "3",
      "kemlerNumber": "33",
      "tunnelCode": "D/E",
      "packingInstructions": "P001, IBC02, R001",
      "packingSv": "BB2",
      "coPacking": "MP19",
      "portableTankInstr": "T4",
      "portableTankSv": "TP1",
      "tankCodes": "LGBF",
      "tankSv": "TU9",
      "tankVehicle": "FL",
      "operationSv": "S2, S20",
      "securityLevel": "1",
      "securityQtyTank": "3000",
      "securityQtyBulk": "a)",
      "securityQtyPackages": "b)",
      "envHazard": "+",
      "specialProvisions": "243, 534, 664"
    }
  ],
  "RID": [
    {
      "unNumber": "1203",
      "sequenceNumber": 1,
      "name": "BENZIN",
      "nameEn": "MOTOR SPIRIT",
      "hazardClass": "3",
      "classificationCode": "F1",
      "packingGroup": "II",
      "hazardLabels": "3",
      "exceptedQty": "E2",
      "limitedQty": "1 L",
      "transportCategory": "2",
      "packingInstructions": "P001, IBC02, R001",
      "packingSv": "BB2",
      "coPacking": "MP19",
      "portableTankInstr": "T4",
      "portableTankSv": "TP1",
      "tankCodes": "LGBF",
      "tankSv": "TU9",
      "expressFreight": "CE7",
      "securityLevel": "1",
      "securityQtyTank": "3000",
      "securityQtyBulk": "a)",
      "securityQtyPackages": "b)",
      "envHazard": "+",
      "specialProvisions": "243, 534"
    }
  ],
  "IMDG": [
    {
      "unNumber": "1203",
      "sequenceNumber": 1,
      "name": "OTTOKRAFTSTOFF",
      "nameEn": "MOTOR SPIRIT",
      "hazardClass": "3",
      "packingGroup": "II",
      "hazardLabels": "3",
      "exceptedQty": "E2",
      "limitedQty": "1 L",
      "packingInstructions": "P001, IBC02",
      "ems1": "F-E",
      "ems2": "S-E",
      "stowageCategory": "E",
      "portableTankInstr": "T4",
      "portableTankSv": "TP1",
      "specialProvisions": "243"
    }
  ],
  "ICAO": [
    {
      "unNumber": "1203",
      "sequenceNumber": 1,
      "name": "Gasoline",
      "hazardClass": "3",
      "packingGroup": "II",
      "hazardLabels": "Liquid flammable",
      "exceptedQty": "E2",
      "limitedQty": "Y341 · max 1 L",
      "packingInstrPassenger": "353",
      "packingInstrCargo": "364",
      "maxNetPassenger": "5 L",
      "maxNetCargo": "60 L",
      "specialProvisions": "A100"
    }
  ],
  "ADN": []
}

export const DEMO_SVS: Record<string, SvText> = {
  "ADR:243": {
    "textDe": "Benzin und Ottokraftstoff für die Verwendung in Ottomotoren (z.B. in Kraftfahrzeugen, ortsfesten Motoren und anderen Motoren) sind ungeachtet der Bandbreite der Flüchtigkeit dieser Eintragung zuzuordnen.",
    "textEn": "Gasoline, motor spirit and petrol for use in spark-ignition engines (e.g. in automobiles, stationary engines and other engines) shall be assigned to this entry regardless of variations in volatility.",
    "textFr": "L'essence destinée à être utilisée comme carburant pour moteurs d'automobiles, moteurs fixes et autres moteurs à allumage commandé doit être classée sous cette rubrique indépendamment de ses caractéristiques de volatilité."
  },
  "ADR:534": {
    "textDe": "Obwohl Benzin unter gewissen klimatischen Bedingungen bei 50 °C einen Dampfdruck von mehr als 110 kPa (1,10 bar) bis höchstens 150 kPa (1,50 bar) haben kann, muss es einem Stoff gleichgestellt bleiben, der bei 50 °C einen Dampfdruck von höchstens 110 kPa (1,10 bar) hat.",
    "textEn": "While in some climatic conditions, petrol (gasoline) may have a vapour pressure at 50 °C of more than 110 kPa (1.10 bar) but not more than 150 kPa (1.50 bar) it is to continue to be considered as a substance having a vapour pressure at 50 °C of not more than 110 kPa (1.10 bar).",
    "textFr": "Nonobstant que l'essence peut, sous certaines conditions climatiques, avoir une pression de vapeur à 50 °C supérieure à 110 kPa (1,10 bar), sans dépasser 150 kPa (1,50 bar), elle doit continuer à être assimilée à une matière ayant une pression de vapeur à 50 °C ne dépassant pas 110 kPa (1,10 bar)."
  },
  "ADR:664": {
    "textDe": "Werden Stoffe unter dieser Eintragung in festverbundenen Tanks (Tankfahrzeugen) oder Aufsetztanks befördert, so dürfen diese Tanks mit Additivierungseinrichtungen ausgerüstet sein.\r\n\r\nAdditivierungseinrichtungen:\r\n\r\n- sind Teil der Bedienungsausrüstung zur Beimischung von Additiven der UN-Nummer 1202, 1993 Verpackungsgruppe III oder 3082 oder von nicht gefährlichen Stoffen während des Entleerens des Tanks;\r\n- bestehen aus Elementen, wie Verbindungsrohren und -schläuchen, Verschlusseinrichtungen, Pumpen und Dosierungseinrichtungen, die mit der Entleerungseinrichtung der Bedienungsausrüstung des Tanks dauerhaft verbunden sind;\r\n- umfassen Umschließungsmittel, die integraler Bestandteil des Tankkörpers oder dauerhaft außen am Tank oder am Tankfahrzeug befestigt sind.\r\n\r\nAlternativ dürfen Additivierungseinrichtungen Anschlusseinrichtungen für die Verbindung mit Verpackungen haben. In diesem Fall wird die Verpackung selbst nicht als Teil der Additivierungseinrichtung angesehen.\r\n\r\nAbhängig von der Konfiguration gelten folgende Vorschriften:\r\n\r\na) Bau der Umschließungsmittel\r\n(i) Als integraler Bestandteil des Tankkörpers (z.B. Tankabteil) müssen sie die zutreffenden Vorschriften des Kapitels 6.8 erfüllen.\r\n(ii) Bei einer dauerhaften Befestigung außen am Tank oder am Tankfahrzeug unterliegen sie nicht den Bauvorschriften des ADR, sofern die folgenden Vorschriften erfüllt sind:\r\nSie bestehen aus einem metallenen Werkstoff und erfüllen die nachstehenden Mindestvorschriften für die Wanddicke:\r\n\r\nWerkstoff\t\tMindestwanddicke *)\r\nrostfreie austenitische Stähle\t2,5 mm\r\nandere Stähle\t\t3 mm\r\nAluminiumlegierungen\t4 mm\r\nAluminium, 99,80 % rein\t6 mm\r\n\r\n*) Wenn die Umschließungsmittel aus einer Doppelwand bestehen, muss die Summe der Wanddicken der metallenen Außenwand und der metallenen Innenwand der vorgeschriebenen Wanddicke entsprechen.\r\n\r\nSchweißarbeiten müssen gemäß dem ersten Unterabsatz des Absatzes 6.8.2.1.23 ausgeführt sein, mit der Ausnahme, dass für die Bestätigung der Qualität der Schweißnähte andere geeignete Methoden angewendet werden dürfen.\r\n(iii) Bei den Verpackungen, die mit der Additivierungseinrichtung verbunden werden können, muss es sich um Metallverpackungen handeln, die den für das betreffende Additiv anwendbaren Bauvorschriften des Kapitels 6.1 entsprechen.\r\n\r\nb) Tankzulassung\r\n\r\nFür Tanks, die mit Additivierungseinrichtungen ausgerüstet sind oder ausgerüstet werden sollen und bei denen die Additivierungseinrichtung nicht in der ursprünglichen Baumusterzulassung des Tanks enthalten ist, gelten die Vorschriften des Absatzes 6.8.2.3.4.\r\n\r\nc) Verwendung von Umschließungsmitteln und Additivierungseinrichtungen\r\n(i) Im Falle von Absatz a) (i) bestehen keine weiteren Vorschriften.\r\n(ii) Im Falle von Absatz a) (ii) darf der Gesamtfassungsraum der Umschließungsmittel 400 Liter je Fahrzeug nicht überschreiten.\r\n(iii) Im Falle von Absatz a) (iii) gelten der Unterabschnitt 7.5.7.5 und der Abschnitt 8.3.3 nicht. Die Verpackungen dürfen nur während des Entleerens des Tanks mit der Additivierungseinrichtung verbunden sein. Während der Beförderung müssen die Verschlüsse und Anschlusseinrichtungen dicht verschlossen sein.\r\n\r\nd) Prüfung von Additivierungseinrichtungen\r\nFür die Additivierungseinrichtung gelten die Vorschriften des Unterabschnitts 6.8.2.4. Im Falle von Absatz a) (ii) müssen die Umschließungsmittel der Additivierungseinrichtung zum Zeitpunkt der erstmaligen Prüfung, der Zwischenprüfung oder der wiederkehrenden Prüfung des Tanks jedoch nur einer äußeren Sichtprüfung und einer Dichtheitsprüfung unterzogen werden. Die Dichtheitsprüfung muss mit einem Prüfdruck von mindestens 0,2 bar durchgeführt werden.\r\n\r\nBem. Für die in Absatz a) (iii) beschriebenen Verpackungen gelten die entsprechenden Vorschriften des ADR.\r\n\r\ne) Beförderungspapier\r\nFür das betreffende Additiv müssen nur die gemäß Absatz 5.4.1.1.1 a) bis d) erforderlichen Angaben im Beförderungspapier vermerkt werden. In diesem Fall muss im Beförderungspapier die Angabe \"ADDITIVIERUNGSEINRICHTUNG\" hinzugefügt werden.\r\n\r\nf) Schulung der Fahrzeugführer\r\nFahrzeugführer, die eine Schulung gemäß Abschnitt 8.2.1 für die Beförderung dieses Stoffes in Tanks erhalten haben, benötigen keine zusätzliche Schulung für die Beförderung der Additive.\r\n\r\ng) Anbringen von Großzetteln (Placards) oder Kennzeichnung\r\nDas Anbringen von Großzetteln (Placards) an oder die Kennzeichnung von festverbundenen Tanks (Tankfahrzeugen) oder Aufsetztanks für die Beförderung von Stoffen unter dieser Eintragung gemäß Kapitel 5.3 wird durch das Vorhandensein einer Additivierungseinrichtung oder der darin enthaltenen Additive nicht beeinflusst.",
    "textEn": "When substances under this entry are carried in fixed tanks (tank-vehicles) or demountable tanks, these tanks may be equipped with additive devices.\r\n\r\nAdditive devices:\r\n- are part of the service equipment for dispensing additives of UN 1202, UN 1993 packing group III, UN 3082 or non-dangerous substances during discharge of the tank;\r\n- consist of elements such as connecting pipes and hoses, closing devices, pumps and dosing devices which are permanently connected to the discharge device of the tank's service equipment;\r\n- include means of containment which are an integral part of the shell, or permanently fixed to the exterior of the tank or tank-vehicle.\r\nAlternatively, additive devices may have connectors for connecting packagings. In this latter case, the packaging itself is not considered part of the additive device.\r\n\r\nThe following requirements shall apply depending on the configuration:\r\n\r\n(a) Construction of the means of containment:\r\n(i) As an integral part of the shell (e.g. a tank compartment), they shall meet the relevant provisions of Chapter 6.8.\r\n(ii) When permanently fixed to the exterior of the tank or to the tank-vehicle, they are not subject to the construction provisions of ADR provided they comply with the following provisions:\r\n\r\nThey shall be made of a metallic material and comply with the following minimum wall thickness requirements:\r\n\r\nMaterial\t\tMinimum wall thickness *)\r\nAustenitic stainless steels\t\t2.5 mm\r\nOther steels\t\t\t3 mm\r\nAluminium alloys\t\t4 mm\r\nPure aluminium of 99.80%\t\t6 mm\r\n\r\n*) For means of containment made with double walls, the aggregate thickness of the outer metal wall and the inner metal wall shall correspond to the wall thickness prescribed.\r\n\r\nWelding shall be carried out in accordance with the first paragraph of 6.8.2.1.23, except that other suitable methods may be applied to confirm the quality of the welding.\r\n\r\n(iii) Packagings which are connectable to the additive device shall be metal packagings and meet the relevant construction requirements of Chapter 6.1, as applicable for the additive concerned.\r\n\r\n(b) Tank approval\r\nFor tanks equipped or intended to be equipped with additive devices, where the additive device is not included in the original type approval of the tank, the provisions of 6.8.2.3.4 shall apply.\r\n\r\n(c) Use of means of containment and additive devices\r\n(i) In case of (a) (i) above, no additional requirements.\r\n(ii) In case of (a) (ii) above, the total capacity of the means of containment shall not exceed 400 litres per vehicle.\r\n(iii) In case of (a) (iii) above, 7.5.7.5 and 8.3.3 shall not apply. The packagings may only be connected to the additive device during discharge of the tank. During carriage, the closures and connectors shall be closed so as to be leaktight.\r\n\r\n(d) Testing for additive devices\r\nThe provisions of 6.8.2.4 shall apply to the additive device. However, in case of (a) (ii) above, at the time of the initial, intermediate or periodic inspection of the tank, the means of containment of the additive device shall only be subject to an external visual inspection and a leakproofness test. The leakproofness test shall be carried out at a test pressure of at least 0.2 bar.\r\n\r\nNOTE: For the packagings described in (a) (iii) above, the relevant provisions of ADR shall apply. \r\n\r\n(e) Transport document \r\nOnly the information required in accordance with 5.4.1.1.1 (a) to (d) needs to be added to the transport document for the additive concerned. In this case, the remark \"additive device\" shall be added to the transport document.\r\n\r\n(f) Training of drivers \r\nDrivers who have been trained in accordance with 8.2.1 for carriage of this substance in tanks need no additional training for the carriage of the additives;\r\n\r\n(g) Placarding or marking \r\nPlacarding or marking of the fixed tank (tank-vehicle) or demountable tank for the carriage of substances under this entry in accordance with Chapter 5.3 is not affected by the presence of an additive device or the additives contained therein.",
    "textFr": "Lorsque des matières classées sous cette rubrique sont transportées dans des citernes fixes (véhicules-citernes) ou des citernes démontables, ces citernes peuvent être équipées de dispositifs pour additifs.\r\n\r\nLes dispositifs pour additifs:\r\n- Font partie de l'équipement de service permettant d'ajouter des additifs du No ONU 1202, du No ONU 1993 groupe d'emballage III, du No ONU 3082 ou des marchandises non dangereuses lors de la vidange de la citerne;\r\n- Se composent d'éléments tels que des tuyaux de raccordement et des flexibles, des dispositifs de fermeture, des pompes et des dispositifs de dosage qui sont reliés en permanence au dispositif de vidange de l'équipement de service de la citerne;\r\n- Comprennent des moyens de rétention qui font partie intégrante du réservoir ou qui sont fixés de façon permanente à l'extérieur de la citerne ou du véhicule-citerne.\r\n\r\nAutrement, les dispositifs pour additifs peuvent être munis de connecteurs permettant de raccorder des emballages. Dans ce cas, l'emballage lui-même n'est pas considéré comme faisant partie du dispositif pour additif.\r\n\r\nLes prescriptions suivantes doivent être appliquées suivant la configuration:\r\n\r\na) Construction des moyens de rétention:\r\ni) Lorsqu'ils sont partie intégrante du réservoir (par exemple comme compartiment de citerne), ils doivent répondre aux dispositions appropriées du chapitre 6.8;\r\nii) Lorsqu'ils sont fixés de manière permanente à l'extérieur de la citerne ou du véhicule-citerne, ils ne sont pas soumis aux dispositions de l'ADR relatives à la construction à condition qu'ils respectent les dispositions suivantes:\r\n\r\nIls doivent être en matériau métallique et doivent satisfaire aux exigences suivantes en ce qui concerne l'épaisseur minimale des parois: \r\n\r\nMatériau\t\t\tEpaisseur minimale des parois *)\r\nAciers inoxydables austénitiques\t2,5 mm\r\nAutres aciers\t\t\t3 mm\r\nAlliages d'aluminium\t\t4 mm\r\nAluminium pur à 99,80%\t\t6 mm\r\n\r\n*) Pour les moyens de rétention à double paroi, la somme de l'épaisseur de la paroi extérieure métallique et de celle de la paroi intérieure métallique doit correspondre à l'épaisseur de paroi requise. \r\n\r\nLes soudures doivent être réalisées conformément au premier paragraphe du 6.8.2.1.23, à ceci près que d'autres méthodes appropriées peuvent être appliquées pour confirmer la qualité des soudures.\r\n\r\niii) Les emballages pouvant être raccordés au dispositif pour additif doivent être des emballages métalliques et doivent répondre aux prescriptions de construction du chapitre 6.1 telles qu'applicables à l'additif concerné;\r\n\r\nb) Agrément de la citerne:\r\nPour les citernes équipées ou destinées à être équipées de dispositifs pour additifs, lorsque le dispositif pour additif n'est pas compris dans l'agrément de type d'origine de la citerne, les dispositions du 6.8.2.3.4 doivent être appliquées;\r\n\r\nc) Utilisation des moyens de rétention et des dispositifs pour additifs:\r\ni) Dans le cas prévu au a) i) ci-dessus, aucune prescription supplémentaire ne s'applique;\r\nii) Dans le cas prévu au a) ii) ci-dessus, la capacité totale des moyens de rétention ne doit pas dépasser 400 litres par véhicule;\r\niii) Dans le cas prévu au a) iii) ci-dessus, le 7.5.7.5 et le 8.3.3 ne s'appliquent pas. Les emballages peuvent être raccordés au dispositif pour additif uniquement lors de la vidange de la citerne. Pendant le transport, les fermetures et connecteurs doivent être fermés de façon étanche;\r\n\r\nd) Epreuves pour les dispositifs pour additifs:\r\nLes dispositions du 6.8.2.4 doivent être appliquées au dispositif pour additif. \r\nCependant, dans le cas prévu au a) ii) ci-dessus, au moment du contrôle initial ou des contrôles intermédiaires ou périodiques de la citerne, les moyens de rétention du dispositif pour additif doivent être uniquement soumis à un examen visuel de l'état extérieur et à une épreuve d'étanchéité. L'épreuve d'étanchéité doit être effectuée à une pression d'épreuve d'au moins 0,2 bar;\r\n\r\nNOTA: Pour les emballages décrits au a) iii) ci-dessus, les dispositions appropriées de l'ADR doivent être appliquées.\r\n\r\ne) Document de transport:\r\nIl n'est nécessaire d'ajouter dans le document de transport que les informations requises au 5.4.1.1.1 a) à d) pour l'additif concerné. Dans ce cas, l'indication \"Dispositif pour additif\" doit être ajoutée dans le document de transport.\r\n\r\nf) Formation des conducteurs\r\nLes conducteurs qui ont reçu une formation conformément au 8.2.1 pour le transport de cette matière en citerne n'ont pas besoin de formation supplémentaire pour le transport des additifs;\r\n\r\ng) Placardage ou marquage\r\nLe placardage ou le marquage des citernes fixes (véhicules-citernes) et des citernes démontables pour le transport des matières de cette rubrique, conformément au chapitre 5.3, n'est pas affecté par la présence d'un dispositif pour additif ou par les additifs qui y sont contenus."
  },
  "RID:243": {
    "textDe": "Benzin und Ottokraftstoff für die Verwendung in Ottomotoren (z.B. in Kraftfahrzeugen, ortsfesten Motoren und anderen Motoren) sind ungeachtet der Bandbreite der Flüchtigkeit dieser Eintragung zuzuordnen.",
    "textEn": "Gasoline, motor spirit and petrol for use in spark-ignition engines (e.g. in automobiles, stationary engines and other engines) shall be assigned to this entry regardless of variations in volatility.",
    "textFr": null
  },
  "RID:534": {
    "textDe": "Obwohl Benzin unter gewissen klimatischen Bedingungen bei 50 °C einen Dampfdruck von mehr als 110 kPa (1,10 bar) bis höchstens 150 kPa (1,50 bar) haben kann, muss es einem Stoff gleichgestellt bleiben, der bei 50 °C einen Dampfdruck von höchstens 110 kPa (1,10 bar) hat.",
    "textEn": "While in some climatic conditions, petrol (gasoline) may have a vapour pressure at 50 °C of more than 110 kPa (1.10 bar) but not more than 150 kPa (1.50 bar) it is to continue to be considered as a substance having a vapour pressure at 50 °C of not more than 110 kPa (1.10 bar).",
    "textFr": null
  },
  "IMDG:243": {
    "textDe": "Benzin und Ottokraftstoff für die Verwendung in Ottomotoren (z. B. in Kraftfahrzeugen, ortsfesten Motoren und anderen Motoren) sind ungeachtet der Bandbreite der Flüchtigkeit dieser Eintragung zuzuordnen.",
    "textEn": "Gasoline, motor spirit and petrol for use in spark-ignition engines (e.g. in automobiles, stationary engines and other engines) shall be assigned to this entry regardless of variations in volatility.",
    "textFr": null
  },
  "ICAO:A100": {
    "textDe": null,
    "textEn": "Gasoline, motor spirit and petrol for use in spark-ignition engines (e.g. in automobiles, stationary engines and other engines) must be assigned to this entry regardless of variations in volatility.",
    "textFr": null
  }
}
