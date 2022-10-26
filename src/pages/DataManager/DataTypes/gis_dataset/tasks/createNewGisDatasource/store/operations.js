import { simpleCreateNewDataSource } from "../../../utils/api";

export async function createNewDataSource(ctx) {
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

    const id = await simpleCreateNewDataSource(ctx);

    ctx.dispatch(updateDataSourceId(id));
    ctx.dispatch(setPublishStatusToPublished());
  } catch (err) {
    ctx.dispatch(setPublishStatusToError());
    ctx.dispatch(updatePublishErrMsg(err.message));
    console.error("==>", err);
  }
}
