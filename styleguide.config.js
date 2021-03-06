const fs = require('fs');
const path = require('path');

const { version } = require('./package.json');
const { theme, styles } = require('./styleguide.styles');
const typeExtractor = require('./docs/util/TypeExtractor');

let exampleCounter = 0;

module.exports = {
    theme,
    styles,
    title: `React Context Menu Wrapper ${version}`,

    assetsDir: 'assets',
    styleguideDir: 'public/v3',
    require: [path.join(__dirname, 'styleguide.css')],

    usageMode: 'expand',
    sections: [
        {
            name: '',
            content: 'docs/Readme.md',
        },
        {
            name: 'Documentation',
            sections: [
                { name: 'Introduction', content: 'docs/markdown/00-Introduction.md' },
                { name: 'Quick demo', content: 'docs/markdown/01-Quick-demo.md' },
                { name: 'Installation', content: 'docs/markdown/02-Installation.md' },
                { name: 'Global context menu', content: 'docs/markdown/03-Global-menu.md' },
                { name: 'Local context menu', content: 'docs/markdown/04-Local-menu.md' },
                { name: 'Shared menu logic', content: 'docs/markdown/05-Shared-menu.md' },
                {
                    name: 'Toggling menus programmatically',
                    content: 'docs/markdown/06-Toggle-menus-programmatically.md',
                },
                { name: 'Styles used on this page', content: 'docs/markdown/07-Styles.md' },
            ],
        },
        {
            name: 'Components',
            components: 'src/ContextMenuWrapper.tsx',
            exampleMode: 'expand',
            usageMode: 'expand',
        },
        {
            name: 'Hooks',
            components: 'src/hooks.tsx',
            exampleMode: 'expand',
            usageMode: 'expand',
        },
    ],
    template: {
        head: {
            links: [
                {
                    rel: 'shortcut icon',
                    type: 'image/png',
                    href: './favicon.png',
                },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css?family=Fira+Code&display=swap',
                },
            ],
        },
    },
    sortProps: props => props,
    propsParser: (filePath, source, resolver, handlers) => {
        const result = require('react-docgen-typescript')
            .withCustomConfig('./tsconfig.json', { savePropValueAsString: true })
            .parse(filePath, source, resolver, handlers);

        return result.map(component => {
            const { props } = component;
            const mappedProps = Object.values(props).reduce((previous, prop) => {
                const { name, type } = prop;
                if (type.name.includes('| undefined')) {
                    type.name = type.name.replace('| undefined', '').trim();
                    if (!prop.defaultValue) prop.defaultValue = { value: 'null' };
                    if (type.name.startsWith('(') && type.name.endsWith(')')) {
                        type.name = type.name.slice(1, type.name.length - 1);
                    }
                }

                return { ...previous, [name]: { ...prop } };
            }, {});

            return {
                ...component,
                props: mappedProps,
            };
        });
    },
    updateExample(props, exampleFilePath) {
        const { settings, lang } = props;
        const exampleDir = path.dirname(exampleFilePath);
        if (typeof settings.componentPath === 'string') {
            const filePath = path.resolve(exampleDir, settings.componentPath);
            const compName = `ExampleComp${exampleCounter++}`;
            const props = {
                content: `import ${compName} from '${filePath}';\n;<${compName}/>;`,
                settings,
                lang,
            };
            // Use lower case, since settings are converted to lowercase for some reason...
            props.settings.displaycontent = fs.readFileSync(filePath, 'utf8');
            return props;
        } else if (typeof settings.typeName === 'string') {
            const content = typeExtractor(settings);
            if (!content.trim()) throw new Error(`Could not find type ${settings.typeName}!`);
            const props = {
                content,
                settings,
                lang: 'typescript',
            };
            props.settings.static = true;
            return props;
        } else if (typeof settings.filePath === 'string') {
            const filePath = path.resolve(exampleDir, settings.filePath);
            const props = {
                content: fs.readFileSync(filePath, 'utf8'),
                settings,
                lang,
            };
            props.settings.static = true;
            return props;
        }
        props.settings.static = settings.live === undefined;
        return props;
    },
};
