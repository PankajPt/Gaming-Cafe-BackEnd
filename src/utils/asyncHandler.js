import ApiError from "./apiError.js";

const asyncHandler = (reqHandler) => {
    return async (req, res, next) => {
      try {
        await reqHandler(req, res, next); // await the handler
      } catch (error) {
        if (error.code === 11000) {
            return res
            .status(409)
            .json(new ApiError(409, `Duplicate entry`))
        } else if ( error.code >= 100 && error.code <= 599 ) {
          return res
          .status(error.code || 500)
          .json(new ApiError(error.code || 500, error.message))
        } else {
            return res
            .status(500)
            .json(new ApiError(500, error.message))
        }
      }
    };
  };
  
  export default asyncHandler;