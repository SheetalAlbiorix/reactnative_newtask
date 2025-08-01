import Strings from "./Strings";

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

// Get greeting message based on time of day
export const getGreeting = () => {
  const nycTime = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
  });
  const nycDate = new Date(nycTime);
  const hour = nycDate.getHours();

  if (hour >= 5 && hour <= 9) {
    return Strings.goodMorning;
  } else if (hour >= 10 && hour <= 11) {
    return Strings.lateMorningVibes;
  } else if (hour >= 12 && hour <= 16) {
    return Strings.goodAfternoon;
  } else if (hour >= 17 && hour <= 20) {
    return Strings.goodEvening;
  } else {
    return Strings.nightOwl;
  }
};

// Get local city name from timezone
export const getLocalCity = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = timezone.split("/");
    if (parts.length > 1) {
      return parts[parts.length - 1].replace(/_/g, " ");
    }
    return timezone;
  } catch (error) {
    return Strings.local;
  }
};

// Get day name from day number
export const getDayName = (dayOfWeek: number): string => {
  const days = [
    Strings.sunday,
    Strings.monday,
    Strings.tuesday,
    Strings.wednesday,
    Strings.thursday,
    Strings.friday,
    Strings.saturday,
  ];
  return days[dayOfWeek] || Strings.unknown;
};

// Get month name from month number
export const getMonthName = (month: number): string => {
  const months = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month] || "Unknown";
};
