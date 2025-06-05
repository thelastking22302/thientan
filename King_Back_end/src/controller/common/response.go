package common

type Response struct {
	Data         any `json:"data"`
	Pagings      any `json:"pagings"`
	AccessToken  any `json:"access_token"`
	RefreshToken any `json:"refresh_token"`
}

func ListResponse(data, pagings any) *Response {
	return &Response{Data: data, Pagings: pagings}
}

func UsersResponse(data, accessToken, refreshToken any) *Response {
	return &Response{Data: data, AccessToken: accessToken, RefreshToken: refreshToken}
}

func ItemsResponse(data any) *Response {
	return &Response{Data: data}
}
