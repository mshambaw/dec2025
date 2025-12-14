exports.handler = async (event) => {
  console.log("MPESA CALLBACK:", event.body);

  return {
    statusCode: 200,
    body: JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" })
  };
};
