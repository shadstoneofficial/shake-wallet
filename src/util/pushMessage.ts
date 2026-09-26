export type ReduxAction = {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
}

export default async function pushMessage(message: ReduxAction) {
  if (!chrome || !chrome.runtime) {
    return;
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const error = chrome.runtime.lastError;

      if (!error) {
        resolve(response);
        return;
      }

      if (isMissingReceiverError(error.message)) {
        resolve(undefined);
        return;
      }

      reject(new Error(error.message));
    });
  });
}

function isMissingReceiverError(message?: string) {
  return (
    message === "Could not establish connection. Receiving end does not exist." ||
    message === "The message port closed before a response was received."
  );
}
