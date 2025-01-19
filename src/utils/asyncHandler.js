const asyncHandler = (reqHandler) => {
    return async (req, res, next) => {
      try {
        await reqHandler(req, res, next); // await the handler
      } catch (err) {
        next(err); // Pass errors to the next middleware
      }
    };
  };
  
  export default asyncHandler;