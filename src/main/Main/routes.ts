import { RouteConfig } from 'react-router-config'
import Root from 'src/main/screens/Root'
import Search from 'src/main/screens/Search'
import Record from 'src/main/screens/Record'

export default {
	path: '/',
	component: Root,
	routes: [
		{
			path: '/',
			exact: true,
			component: Search,
		},
		{
			path: '/record/:id',
			exact: true,
			component: Record,
		},
	]
} as RouteConfig
