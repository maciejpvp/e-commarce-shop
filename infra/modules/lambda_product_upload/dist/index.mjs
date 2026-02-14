// src/upload_product/index.ts
var handler = async (event) => {
  console.log("Received uploadProduct event:", JSON.stringify(event, null, 2));
  const body = event.body ? JSON.parse(event.body) : {};
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Product upload event received successfully",
      receivedData: body
    })
  };
};
export {
  handler
};
