const asyncHandler = (reqHandler) => {
    return async (req, res, next) => {
      try {
        await reqHandler(req, res, next); // await the handler
      } catch (err) {
        next(err)
        // res
        //   .status(err.code || 500)
        //   .json({ success: false, message: err.message })
      }
    };
  };
  
  export default asyncHandler;