/**
 * Editor route orchestration entrypoint.
 *
 * The workspace implementation is isolated so future persistence, section,
 * and rhyme hooks can evolve without growing the route module.
 */
export { default } from './editor/EditorWorkspacePage';
