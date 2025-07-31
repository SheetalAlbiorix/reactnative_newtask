export const isEmpty = (value: string) => {
  return value === undefined || value === null || value === "";
};

export const isValidEmail = (email: string) => {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,3}))$/;
  return re.test(String(email).toLowerCase());
};

export const isValidPassword = (password: string) => {
  return password != undefined && password != null && password.length > 6;
};
