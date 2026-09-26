import type {
  ApiItem,
  ApiItemCreate,
  ApiShipment,
  ApiShipmentCreate,
  ApiShipmentDetail,
  ApiShipmentLine,
  ApiShipmentLineUpdate,
  ApiShipmentLineWrite,
  ApiShipmentUpdate,
} from '@/types/api'
import { apiGet, apiSend } from './http'

/**
 * The shipment endpoints, raw. The mapping to what a screen renders lives in
 * `@/utils/mapper/shipmentMapper`; the order the builder calls these in — create,
 * then costs, then lines — lives in `@/composables/useShipmentBuilder`, because
 * it is a flow rather than a request.
 */

/** `GET /shipments` — headers only, newest first is the backend's own order. */
export const fetchShipments = (signal?: AbortSignal) =>
  apiGet<ApiShipment[]>('/shipments', undefined, signal)

/** `GET /shipments/{id}` — the header with its lines and its named costs. */
export const fetchShipment = (id: number, signal?: AbortSignal) =>
  apiGet<ApiShipmentDetail>(`/shipments/${id}`, undefined, signal)

/** `GET /shipments/{id}/preview` — what the freight would do to each item. */
export const fetchShipmentPreview = (id: number, signal?: AbortSignal) =>
  apiGet<ApiShipmentDetail>(`/shipments/${id}/preview`, undefined, signal)

export const createShipment = (body: ApiShipmentCreate) =>
  apiSend<ApiShipmentDetail>('POST', '/shipments', body)

/** `PATCH /shipments/{id}`. Passing `cost_lines` replaces the set wholesale. */
export const updateShipment = (id: number, body: ApiShipmentUpdate) =>
  apiSend<ApiShipmentDetail>('PATCH', `/shipments/${id}`, body)

export const addShipmentLine = (id: number, body: ApiShipmentLineWrite) =>
  apiSend<ApiShipmentLine>('POST', `/shipments/${id}/lines`, body)

export const updateShipmentLine = (id: number, lineId: number, body: ApiShipmentLineUpdate) =>
  apiSend<ApiShipmentLine>('PATCH', `/shipments/${id}/lines/${lineId}`, body)

export const removeShipmentLine = (id: number, lineId: number) =>
  apiSend<ApiShipmentLine>('DELETE', `/shipments/${id}/lines/${lineId}`)

/** `POST /shipments/{id}/receive` — the irreversible one, by the user's own hand. */
export const receiveShipment = (id: number) =>
  apiSend<ApiShipmentDetail>('POST', `/shipments/${id}/receive`)

/**
 * `PATCH /items/{id}` — used by the preview to give a blocked row its group.
 *
 * The create it pairs with lives in `@/api/item` (`createItem`), which is where
 * the item's own endpoints are: naming an item in a shipment creates the same
 * stub the catalogue's create screen would, with no group — exactly the state
 * the preview then asks him to resolve.
 */
export const updateItem = (id: number, body: Partial<ApiItemCreate>) =>
  apiSend<ApiItem>('PATCH', `/items/${id}`, body)
