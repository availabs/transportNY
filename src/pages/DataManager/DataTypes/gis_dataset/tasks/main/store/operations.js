import {
  simpleCreateNewDataSource,
  simpleUpdateExistingDataSource,
} from "../../../utils/api";

async function main(createNew, ctx) {
  console.log(ctx);
  const {
    actions: {
      updateDataSourceId,
      setPublishStatusToInProgress,
      setPublishStatusToPublished,
      setPublishStatusToError,
      updatePublishErrMsg,
    },
  } = ctx;

  try {
    ctx.dispatch(setPublishStatusToInProgress());

    if (createNew) {
      const id = await simpleCreateNewDataSource(ctx);

      ctx.dispatch(updateDataSourceId(id));
    } else {
      await simpleUpdateExistingDataSource(ctx);
    }

    ctx.dispatch(setPublishStatusToPublished());
  } catch (err) {
    ctx.dispatch(setPublishStatusToError());
    ctx.dispatch(updatePublishErrMsg(err.message));
    console.error("==>", err);
  }
}

export const createNewDataSource = main.bind(null, true);
export const updateExistingDataSource = main.bind(null, false);
