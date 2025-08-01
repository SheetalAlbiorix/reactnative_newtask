import Color from "@/utils/Color";
import React, { memo, useState } from "react";
import { View, Modal, ActivityIndicator, StyleSheet } from "react-native";

const Loader = (props: any) => {
  const { loading } = props;
  const [state, setState] = useState({ status: true });
  return (
    <Modal
      transparent={true}
      animationType={"none"}
      visible={state.status ? loading : state.status}
      onRequestClose={() => {
        setState({ status: false });
      }}
    >
      <View style={[styles.centeredView]}>
        <View style={styles.modalView}>
          <ActivityIndicator
            size="large"
            color={Color.blue}
            animating={loading}
          />
        </View>
      </View>
    </Modal>
  );
};
export default memo(Loader);

const styles = StyleSheet.create({
  centeredView: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000030",
  },
  modalView: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
