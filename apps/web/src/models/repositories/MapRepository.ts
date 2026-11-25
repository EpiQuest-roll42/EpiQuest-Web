import type {
  ActiveEffect,
  AddEffectInput,
  CreateMapInput,
  CreateMapTemplateInput,
  CreateMapTokenInput,
  DoorGm,
  FogGm,
  FogUpdateInput,
  HitPointsAdjustmentInput,
  Id,
  MapGeometryInput,
  MapGmView,
  MapSummaryPage,
  MapTemplateGm,
  MapView,
  ParameterCampaignId,
  ParameterCursor,
  ParameterLimit,
  ParameterMapId,
  ParameterTokenId,
  TokenGm,
  UpdateDoorInput,
  UpdateMapInput,
  UpdateMapTemplateInput,
  UpdateMapTokenInput,
  operations,
} from '../api/schema';

type QueryParams<Operation extends keyof operations> = NonNullable<
  operations[Operation]['parameters']['query']
>;

export interface MapRepository {
  listMaps(
    campaignId: ParameterCampaignId,
    params?: {
      cursor?: ParameterCursor;
      limit?: ParameterLimit;
    },
  ): Promise<MapSummaryPage>;
  createMap(campaignId: ParameterCampaignId, input: CreateMapInput): Promise<MapGmView>;
  getMap(mapId: ParameterMapId): Promise<MapView>;
  updateMap(mapId: ParameterMapId, input: UpdateMapInput): Promise<MapGmView>;
  deleteMap(mapId: ParameterMapId): Promise<void>;
  uploadMapBackground(mapId: ParameterMapId, file: Blob): Promise<MapGmView>;
  getMapTile(
    mapId: ParameterMapId,
    x: operations['getMapTile']['parameters']['path']['x'],
    y: operations['getMapTile']['parameters']['path']['y'],
    params?: QueryParams<'getMapTile'>,
  ): Promise<Blob>;
  replaceMapGeometry(
    mapId: ParameterMapId,
    input: MapGeometryInput,
    ifMatch: string,
  ): Promise<MapGmView>;
  updateDoor(mapId: ParameterMapId, doorId: Id, input: UpdateDoorInput): Promise<DoorGm>;
  updateFog(mapId: ParameterMapId, input: FogUpdateInput): Promise<FogGm>;
  createMapTemplate(mapId: ParameterMapId, input: CreateMapTemplateInput): Promise<MapTemplateGm>;
  updateMapTemplate(
    mapId: ParameterMapId,
    templateId: Id,
    input: UpdateMapTemplateInput,
  ): Promise<MapTemplateGm>;
  deleteMapTemplate(mapId: ParameterMapId, templateId: Id): Promise<void>;
  createMapToken(mapId: ParameterMapId, input: CreateMapTokenInput): Promise<TokenGm>;
  updateMapToken(
    mapId: ParameterMapId,
    tokenId: ParameterTokenId,
    input: UpdateMapTokenInput,
  ): Promise<TokenGm>;
  deleteMapToken(mapId: ParameterMapId, tokenId: ParameterTokenId): Promise<void>;
  adjustCreatureHitPoints(
    mapId: ParameterMapId,
    tokenId: ParameterTokenId,
    input: HitPointsAdjustmentInput,
  ): Promise<TokenGm>;
  addTokenEffect(
    mapId: ParameterMapId,
    tokenId: ParameterTokenId,
    input: AddEffectInput,
  ): Promise<ActiveEffect>;
  removeTokenEffect(mapId: ParameterMapId, tokenId: ParameterTokenId, effectId: Id): Promise<void>;
}
